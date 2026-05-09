import asyncio
import json
import re
import secrets
import shutil
import subprocess
import tempfile
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional

import requests

__all__ = [
    "init_wallet",
    "import_wallet_from_seed",
    "get_sol_balance",
    "transfer_sol",
    "get_token_accounts",
    "get_transaction_history",
    "get_nft_collections",
    "stake_sol",
    "get_vote_accounts",
    "get_loan_positions",
]

TOKEN_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"

# Common lending program IDs for broad exposure hints.
KNOWN_LENDING_PROGRAMS = {
    "solend-main": "So1endDq2YkqhipRh3WViPa8hdiSpxWy6z3Z6tMCpAo",
    "kamino-lend": "KLend2g3juJBmS9V2Jr7A9sqB2qAiLZxF4M7v4Y6mJ",
    "marginfi": "MFv2hWf31Z9kbm7wY9kE6x4HAXfkrqQhJ8f6w2c8P4s",
}


@dataclass
class WalletInfo:
    address: str
    seed_phrase: Optional[str]
    last_tx_id: Optional[str]
    last_balance: float
    balance_updated: datetime


@dataclass
class Transaction:
    signature: str
    slot: int
    block_time: str
    status: str
    fee: float
    memo: Optional[str]
    pre_balance: float
    post_balance: float
    amount: float
    source: str
    destination: str
    program_id: str
    instruction: str


class SolanaClient:
    def __init__(self, wallet_config: Optional[Dict[str, object]] = None):
        wallet_config = wallet_config or {}
        self.wallet_config = wallet_config
        self.rpc_endpoint = str(
            wallet_config.get("rpc_endpoint", "https://api.mainnet-beta.solana.com")
        )
        self.timeout_secs = int(wallet_config.get("timeout_secs", 15))
        self.keypair_path = wallet_config.get("keypair_path")
        self.wallet_keypairs: Dict[str, str] = {
            str(k): str(v)
            for k, v in (wallet_config.get("wallet_keypairs") or {}).items()
            if str(k).strip() and str(v).strip()
        }

    # ------------------------------------------------------------------
    # Core helpers
    # ------------------------------------------------------------------

    def _rpc_call(self, method: str, params: Optional[List[object]] = None) -> object:
        payload = {
            "jsonrpc": "2.0",
            "id": secrets.randbits(31),
            "method": method,
            "params": params or [],
        }
        response = requests.post(
            self.rpc_endpoint,
            json=payload,
            timeout=self.timeout_secs,
        )
        response.raise_for_status()
        body = response.json()
        if "error" in body:
            message = body["error"].get("message", "unknown RPC error")
            raise RuntimeError(f"Solana RPC error for {method}: {message}")
        return body.get("result")

    @staticmethod
    def _ensure_cli(binary: str) -> str:
        path = shutil.which(binary)
        if not path:
            raise RuntimeError(
                f"Required binary '{binary}' not found. Install Solana CLI to use wallet write operations."
            )
        return path

    def _run_cli(
        self,
        args: List[str],
        *,
        stdin_text: Optional[str] = None,
    ) -> str:
        process = subprocess.run(
            args,
            input=stdin_text,
            text=True,
            capture_output=True,
            check=False,
        )
        if process.returncode != 0:
            stderr = process.stderr.strip() or process.stdout.strip() or "unknown error"
            raise RuntimeError(f"Command failed ({' '.join(args)}): {stderr}")
        return (process.stdout or "").strip()

    @staticmethod
    def _extract_signature(text: str) -> Optional[str]:
        for line in text.splitlines():
            lower = line.lower()
            if "signature" in lower:
                candidate = line.split(":")[-1].strip()
                if candidate:
                    return candidate
        match = re.search(r"\b([1-9A-HJ-NP-Za-km-z]{64,88})\b", text)
        return match.group(1) if match else None

    def _resolve_keypair_for_wallet(self, wallet: WalletInfo) -> str:
        if wallet.address in self.wallet_keypairs:
            return self.wallet_keypairs[wallet.address]
        if isinstance(self.keypair_path, str) and self.keypair_path.strip():
            return self.keypair_path.strip()
        raise RuntimeError(
            "No keypair file configured for source wallet. Set `keypair_path` or `wallet_keypairs[address]`."
        )

    # ------------------------------------------------------------------
    # Wallet + transfer operations
    # ------------------------------------------------------------------

    async def create_wallet(self) -> WalletInfo:
        self._ensure_cli("solana-keygen")
        out_dir = Path(
            str(
                self.wallet_config.get(
                    "wallet_out_dir", "~/.config/solana/hermes-generated"
                )
            )
        ).expanduser()
        out_dir.mkdir(parents=True, exist_ok=True)
        outfile = out_dir / f"wallet-{datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S')}.json"
        output = self._run_cli(
            [
                "solana-keygen",
                "new",
                "--force",
                "--silent",
                "--no-bip39-passphrase",
                "--outfile",
                str(outfile),
            ]
        )
        address = self._run_cli(["solana-keygen", "pubkey", str(outfile)]).strip()
        seed_phrase = None
        lines = [line.strip() for line in output.splitlines() if line.strip()]
        if lines:
            seed_phrase = lines[-1]
        self.wallet_keypairs[address] = str(outfile)
        return WalletInfo(
            address=address,
            seed_phrase=seed_phrase,
            last_tx_id=None,
            last_balance=await self.get_sol_balance(address),
            balance_updated=datetime.now(timezone.utc),
        )

    def import_wallet(self, seed_phrase: str) -> WalletInfo:
        if not seed_phrase or not seed_phrase.strip():
            raise ValueError("seed_phrase cannot be empty")
        self._ensure_cli("solana-keygen")
        out_dir = Path(
            str(
                self.wallet_config.get(
                    "wallet_out_dir", "~/.config/solana/hermes-imported"
                )
            )
        ).expanduser()
        out_dir.mkdir(parents=True, exist_ok=True)
        outfile = out_dir / f"import-{datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S')}.json"
        self._run_cli(
            [
                "solana-keygen",
                "recover",
                "prompt:?key=0/0",
                "--force",
                "--no-bip39-passphrase",
                "--outfile",
                str(outfile),
            ],
            stdin_text=seed_phrase.strip() + "\n",
        )
        address = self._run_cli(["solana-keygen", "pubkey", str(outfile)]).strip()
        self.wallet_keypairs[address] = str(outfile)
        return WalletInfo(
            address=address,
            seed_phrase=seed_phrase.strip(),
            last_tx_id=None,
            last_balance=0.0,
            balance_updated=datetime.now(timezone.utc),
        )

    async def get_sol_balance(self, address: str) -> float:
        result = self._rpc_call("getBalance", [address, {"commitment": "confirmed"}])
        lamports = int((result or {}).get("value", 0))
        return lamports / 1_000_000_000

    async def transfer_sol(
        self, from_wallet: WalletInfo, to_wallet: str, amount: float
    ) -> str:
        if amount <= 0:
            raise ValueError("amount must be positive")
        self._ensure_cli("solana")
        keypair = self._resolve_keypair_for_wallet(from_wallet)
        output = self._run_cli(
            [
                "solana",
                "--url",
                self.rpc_endpoint,
                "--keypair",
                keypair,
                "transfer",
                to_wallet,
                str(amount),
                "--allow-unfunded-recipient",
            ]
        )
        signature = self._extract_signature(output)
        if not signature:
            raise RuntimeError(
                f"Transfer command succeeded but signature was not detected: {output}"
            )
        from_wallet.last_tx_id = signature
        from_wallet.balance_updated = datetime.now(timezone.utc)
        return signature

    async def stake_sol(
        self, delegator_wallet: WalletInfo, validator_pubkey: str, amount: float
    ) -> Dict[str, str]:
        if amount <= 0:
            raise ValueError("amount must be positive")
        self._ensure_cli("solana")
        self._ensure_cli("solana-keygen")
        keypair = self._resolve_keypair_for_wallet(delegator_wallet)
        with tempfile.TemporaryDirectory() as tmpdir:
            stake_kp = Path(tmpdir) / "stake-account.json"
            self._run_cli(
                [
                    "solana-keygen",
                    "new",
                    "--force",
                    "--silent",
                    "--no-bip39-passphrase",
                    "--outfile",
                    str(stake_kp),
                ]
            )
            create_out = self._run_cli(
                [
                    "solana",
                    "--url",
                    self.rpc_endpoint,
                    "--keypair",
                    keypair,
                    "create-stake-account",
                    str(stake_kp),
                    str(amount),
                ]
            )
            delegate_out = self._run_cli(
                [
                    "solana",
                    "--url",
                    self.rpc_endpoint,
                    "--keypair",
                    keypair,
                    "delegate-stake",
                    str(stake_kp),
                    validator_pubkey,
                ]
            )
            stake_address = self._run_cli(["solana-keygen", "pubkey", str(stake_kp)]).strip()
        return {
            "stake_account": stake_address,
            "create_signature": self._extract_signature(create_out) or "",
            "delegate_signature": self._extract_signature(delegate_out) or "",
        }

    # ------------------------------------------------------------------
    # Read-only account analytics
    # ------------------------------------------------------------------

    async def get_token_accounts(self, wallet_address: str) -> List[Dict]:
        result = self._rpc_call(
            "getTokenAccountsByOwner",
            [
                wallet_address,
                {"programId": TOKEN_PROGRAM_ID},
                {"encoding": "jsonParsed", "commitment": "confirmed"},
            ],
        )
        accounts = []
        for item in (result or {}).get("value", []):
            parsed = (
                item.get("account", {})
                .get("data", {})
                .get("parsed", {})
                .get("info", {})
            )
            token_amount = parsed.get("tokenAmount", {})
            accounts.append(
                {
                    "pubkey": item.get("pubkey"),
                    "mint": parsed.get("mint"),
                    "owner": parsed.get("owner"),
                    "amount": token_amount.get("amount"),
                    "ui_amount": token_amount.get("uiAmount"),
                    "decimals": token_amount.get("decimals"),
                    "state": parsed.get("state"),
                }
            )
        return accounts

    async def get_transaction_history(
        self, wallet_address: str, limit: int = 20
    ) -> List[Transaction]:
        limit = max(1, min(int(limit), 100))
        signatures = self._rpc_call(
            "getSignaturesForAddress",
            [wallet_address, {"limit": limit, "commitment": "confirmed"}],
        )
        out: List[Transaction] = []
        for row in signatures or []:
            sig = row.get("signature")
            if not sig:
                continue
            tx = self._rpc_call(
                "getTransaction",
                [sig, {"encoding": "jsonParsed", "maxSupportedTransactionVersion": 0}],
            )
            if not tx:
                continue
            meta = tx.get("meta") or {}
            message = ((tx.get("transaction") or {}).get("message") or {})
            instructions = message.get("instructions") or []
            instr = instructions[0] if instructions else {}
            parsed = instr.get("parsed") or {}
            info = parsed.get("info") or {}
            pre_bal = (meta.get("preBalances") or [0])[0] if meta.get("preBalances") else 0
            post_bal = (meta.get("postBalances") or [0])[0] if meta.get("postBalances") else 0
            block_time = row.get("blockTime")
            out.append(
                Transaction(
                    signature=sig,
                    slot=int(tx.get("slot") or row.get("slot") or 0),
                    block_time=(
                        datetime.fromtimestamp(block_time, tz=timezone.utc).isoformat()
                        if block_time
                        else ""
                    ),
                    status="ok" if meta.get("err") in (None, {}, []) else "error",
                    fee=float(meta.get("fee", 0)) / 1_000_000_000,
                    memo=(row.get("memo") if isinstance(row, dict) else None),
                    pre_balance=float(pre_bal) / 1_000_000_000,
                    post_balance=float(post_bal) / 1_000_000_000,
                    amount=abs(float(post_bal - pre_bal)) / 1_000_000_000,
                    source=str(info.get("source", "")),
                    destination=str(info.get("destination", "")),
                    program_id=str(instr.get("programId", "")),
                    instruction=str(parsed.get("type", instr.get("program", "unknown"))),
                )
            )
        return out

    async def get_nft_collections(self, wallet_address: str) -> List[Dict]:
        token_accounts = await self.get_token_accounts(wallet_address)
        nfts = []
        for token in token_accounts:
            decimals = token.get("decimals")
            amount = token.get("amount")
            if decimals == 0 and str(amount) == "1":
                mint = token.get("mint")
                nfts.append(
                    {
                        "mint": mint,
                        "token_account": token.get("pubkey"),
                        "collection_hint": f"mint:{mint}",
                    }
                )
        return nfts

    async def get_vote_accounts(self, wallet_address: str) -> List[Dict]:
        result = self._rpc_call("getVoteAccounts", [{"commitment": "confirmed"}]) or {}
        rows = []
        for bucket in ("current", "delinquent"):
            for acct in result.get(bucket, []) or []:
                authorized = acct.get("authorizedWithdrawer")
                node = acct.get("nodePubkey")
                vote = acct.get("votePubkey")
                if wallet_address in (authorized, node, vote):
                    rows.append(
                        {
                            "bucket": bucket,
                            "vote_pubkey": vote,
                            "node_pubkey": node,
                            "authorized_withdrawer": authorized,
                            "activated_stake": acct.get("activatedStake"),
                            "commission": acct.get("commission"),
                            "epoch_credits": acct.get("epochCredits"),
                        }
                    )
        return rows

    async def get_loan_positions(self, wallet_address: str) -> List[Dict]:
        token_accounts = await self.get_token_accounts(wallet_address)
        positions = []
        for token in token_accounts:
            mint = str(token.get("mint") or "").lower()
            for protocol, program in KNOWN_LENDING_PROGRAMS.items():
                if mint and mint in program.lower():
                    positions.append(
                        {
                            "protocol": protocol,
                            "program_id": program,
                            "mint": token.get("mint"),
                            "ui_amount": token.get("ui_amount"),
                            "token_account": token.get("pubkey"),
                        }
                    )
        return positions


# ----------------------------------------------------------------------
# Functional wrappers
# ----------------------------------------------------------------------


def _run(coro):
    return asyncio.run(coro)


def init_wallet(wallet_config: Optional[Dict[str, object]] = None) -> WalletInfo:
    return _run(SolanaClient(wallet_config).create_wallet())


def import_wallet_from_seed(
    seed_phrase: str, wallet_config: Optional[Dict[str, object]] = None
) -> WalletInfo:
    return SolanaClient(wallet_config).import_wallet(seed_phrase)


def get_sol_balance(address: str, wallet_config: Optional[Dict[str, object]] = None) -> float:
    return _run(SolanaClient(wallet_config).get_sol_balance(address))


def transfer_sol(
    from_wallet: WalletInfo,
    to_wallet: str,
    amount: float,
    wallet_config: Optional[Dict[str, object]] = None,
) -> str:
    return _run(SolanaClient(wallet_config).transfer_sol(from_wallet, to_wallet, amount))


def get_token_accounts(
    wallet_address: str, wallet_config: Optional[Dict[str, object]] = None
) -> List[Dict]:
    return _run(SolanaClient(wallet_config).get_token_accounts(wallet_address))


def get_transaction_history(
    wallet_address: str, limit: int = 20, wallet_config: Optional[Dict[str, object]] = None
) -> List[Transaction]:
    return _run(
        SolanaClient(wallet_config).get_transaction_history(wallet_address, limit=limit)
    )


def get_nft_collections(
    wallet_address: str, wallet_config: Optional[Dict[str, object]] = None
) -> List[Dict]:
    return _run(SolanaClient(wallet_config).get_nft_collections(wallet_address))


def stake_sol(
    delegator_wallet: WalletInfo,
    validator_pubkey: str,
    amount: float,
    wallet_config: Optional[Dict[str, object]] = None,
) -> Dict[str, str]:
    return _run(
        SolanaClient(wallet_config).stake_sol(delegator_wallet, validator_pubkey, amount)
    )


def get_vote_accounts(
    wallet_address: str, wallet_config: Optional[Dict[str, object]] = None
) -> List[Dict]:
    return _run(SolanaClient(wallet_config).get_vote_accounts(wallet_address))


def get_loan_positions(
    wallet_address: str, wallet_config: Optional[Dict[str, object]] = None
) -> List[Dict]:
    return _run(SolanaClient(wallet_config).get_loan_positions(wallet_address))


def main():
    config = {"rpc_endpoint": "https://api.mainnet-beta.solana.com"}
    client = SolanaClient(config)
    sample_wallet = "11111111111111111111111111111111"
    print(json.dumps({"rpc_endpoint": client.rpc_endpoint}, indent=2))
    print(f"Sample balance lookup target: {sample_wallet}")


if __name__ == "__main__":
    main()
