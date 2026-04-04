import { CoinWallet } from "@/components/coins/CoinWallet";
import { CoinBalanceWidget } from "@/components/coins/CoinBalanceWidget";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Wallet = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <CoinBalanceWidget />
        </div>
        <h1 className="text-2xl font-bold mb-4">🪙 My Wallet</h1>
        <CoinWallet />
      </div>
    </div>
  );
};

export default Wallet;
