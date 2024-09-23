import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { ArrowRight, Package, Zap, Star, Sparkles } from 'lucide-react';
import { useOrderService } from '../services/orderService';
import { useUser } from '@clerk/nextjs';

const LetyboOrderingPlatform = () => {
  const { user } = useUser();
  const { createOrder } = useOrderService();
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [totalOrders, setTotalOrders] = useState(0);
  const [customVials, setCustomVials] = useState(6);
  const [currentTier, setCurrentTier] = useState(0);
  const [nextTierProgress, setNextTierProgress] = useState(0);

  const minPrice = 225;
  const maxPrice = 350;
  const maxVials = 60;

  const calculatePrice = (vials: number) => {
    const priceRange = maxPrice - minPrice;
    const priceDecrement = priceRange * ((vials - 6) / (maxVials - 6));
    return Math.round((maxPrice - priceDecrement) * 100) / 100;
  };

  const packages = [
    { name: "Starter", vials: 12, get pricePerVial() { return calculatePrice(this.vials); }, icon: Package },
    { name: "Professional", vials: 24, get pricePerVial() { return calculatePrice(this.vials); }, icon: Zap },
    { name: "Premium", vials: 36, get pricePerVial() { return calculatePrice(this.vials); }, icon: Star }
  ];

  const tiers = [
    { threshold: 0, name: "Starter" },
    { threshold: 12, name: "Professional" },
    { threshold: 24, name: "Premium" }
  ];

  useEffect(() => {
    updateTierInfo(totalOrders + (selectedPackage?.vials || 0));
  }, [totalOrders, selectedPackage]);

  const updateTierInfo = (vials: number) => {
    const newTier = tiers.findIndex((tier, index) => 
      vials >= tier.threshold && (index === tiers.length - 1 || vials < tiers[index + 1].threshold)
    );
    setCurrentTier(newTier);

    const currentTierThreshold = tiers[newTier].threshold;
    const nextTierThreshold = tiers[newTier + 1]?.threshold || Infinity;
    const progress = ((vials - currentTierThreshold) / (nextTierThreshold - currentTierThreshold)) * 100;
    setNextTierProgress(Math.min(progress, 100));
  };

  const handleSelectPackage = (pkg) => {
    setSelectedPackage(pkg);
    setCustomVials(pkg.vials);
    updateTierInfo(totalOrders + pkg.vials);
  };

  const handlePlaceOrder = async () => {
    if (selectedPackage && user) {
      const newTotalOrders = totalOrders + selectedPackage.vials;
      setTotalOrders(newTotalOrders);

      // Save the order to the database
      try {
        const orderData = {
          user_id: user.id,
          user_name: user.fullName,
          selected_package: selectedPackage.name,
          vials: selectedPackage.vials,
          pricepervial: selectedPackage.pricePerVial,
          total: selectedPackage.vials * selectedPackage.pricePerVial,
        };
        await createOrder(orderData);
        alert(`Order placed for ${selectedPackage.vials} vials! Total orders: ${newTotalOrders}`);
      } catch (error) {
        console.error("Error placing order:", error);
        alert("Failed to place order. Please try again.");
      }
    }
  };

  const handleCustomVialChange = (value) => {
    const vials = value[0];
    setCustomVials(vials);
    const pricePerVial = calculatePrice(vials);
    setSelectedPackage({ name: "Custom", vials: vials, pricePerVial: pricePerVial });
    updateTierInfo(totalOrders + vials);
  };

  const CustomProgressBar = ({ value }) => (
    <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
      <div 
        className="h-full bg-royal-blue transition-all duration-500 ease-in-out"
        style={{ width: `${value}%` }}
      />
    </div>
  );

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <Card className="w-[450px] shadow-lg overflow-hidden">
        <CardHeader className="bg-royal-blue text-white py-6 px-6 text-center">
          <CardTitle className="text-black text-2xl font-bold mb-1">Letybo Ordering Platform</CardTitle>
          <CardDescription className="text-blue-700">Order in multiples of 6 vials</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-6">
            <h3 className="font-semibold text-lg mb-4 flex items-center justify-center">
              Most Popular Packages <Sparkles className="ml-2 h-4 w-4 text-royal-blue" />
            </h3>
            <div className="flex flex-wrap gap-2 justify-center mb-6">
              {packages.map((pkg) => (
                <Card 
                  key={pkg.name} 
                  className={`cursor-pointer transition-all ${selectedPackage === pkg ? 'ring-2 ring-royal-blue shadow-md' : 'hover:shadow-md'}`}
                  onClick={() => handleSelectPackage(pkg)}
                >
                  <CardContent className="p-4 text-center">
                    <pkg.icon className="w-8 h-8 mx-auto mb-2 text-royal-blue" />
                    <h3 className="font-semibold mb-1">{pkg.name}</h3>
                    <p className="text-sm text-gray-500 mb-2">{pkg.vials} vials</p>
                    <p className="font-bold mb-2">${pkg.pricePerVial.toFixed(2)}/vial</p>
                    <Badge variant="secondary" className="bg-royal-blue/10 text-royal-blue">Popular</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-3">Custom Order</h3>
              <p className="text-sm text-gray-600 mb-2">Adjust the slider to order any multiple of 6 vials</p>
              <Slider
                min={6}
                max={60}
                step={6}
                value={[customVials]}
                onValueChange={handleCustomVialChange}
                className="mb-2"
              />
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">6 vials</span>
                <span className="text-sm text-gray-600">60 vials</span>
              </div>
              <p className="text-sm font-semibold mb-2">
                Selected: {customVials} vials at ${calculatePrice(customVials).toFixed(2)}/vial
              </p>
              
              <div className="mt-4">
                <h4 className="font-semibold mb-2">Your Tier Status:</h4>
                <CustomProgressBar value={nextTierProgress} />
                <div className="flex justify-between mt-2 text-sm text-gray-600">
                  <span>Starter</span>
                  <span>Professional</span>
                  <span>Premium</span>
                </div>
                <p className="text-sm mt-2">
                  Current Tier: <Badge variant="outline" className="bg-royal-blue/10 text-royal-blue">{tiers[currentTier].name}</Badge>
                </p>
                <p className="text-sm">
                  {totalOrders} vials ordered + {selectedPackage?.vials || 0} in cart
                  {currentTier < tiers.length - 1 && ` (${tiers[currentTier + 1].threshold - (totalOrders + (selectedPackage?.vials || 0))} more to next tier)`}
                </p>
              </div>
            </div>
            
            {selectedPackage && (
              <Card className="mb-6 bg-royal-blue/5 border-royal-blue">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-2">Selected Package: {selectedPackage.name}</h3>
                  <p className="mb-2">{selectedPackage.vials} vials at ${selectedPackage.pricePerVial.toFixed(2)}/vial</p>
                  <p className="font-bold text-xl mb-4">
                    Total: ${(selectedPackage.vials * selectedPackage.pricePerVial).toFixed(2)}
                  </p>
                  <Button className="text-black w-full bg-royal-blue hover:bg-royal-blue/90" onClick={handlePlaceOrder}>
                    Place Order <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            )}

            <p className="text-sm text-gray-500 italic mt-4">
              Letybo can be ordered in multiples of 6 vials. Enjoy greater savings with larger orders!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LetyboOrderingPlatform;
