"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoginForm } from "./LoginForm";
// import { RegisterForm } from "./RegisterForm"; // commented out

export default function AuthTabs() {
  const [activeTab, setActiveTab] = useState("login");

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-md overflow-hidden">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              Welcome
            </CardTitle>
            <CardDescription className="text-center">
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 mb-6 relative">
                <motion.div
                  className="absolute bottom-0 h-[2px] bg-primary"
                  animate={{
                    left: activeTab === "login" ? "0%" : "50%",
                    width: "50%",
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
                <TabsTrigger value="login" className="cursor-pointer">
                  Login
                </TabsTrigger>
                <TabsTrigger value="register" className="cursor-pointer">
                  Register
                </TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                <AnimatePresence mode="wait">
                  <LoginForm />
                </AnimatePresence>
              </TabsContent>
              <TabsContent value="register">
                <AnimatePresence mode="wait">
                  <div className="text-xl font-bold text-center">Coming Soon...</div>
                  {/* <RegisterForm setActive={setActiveTab} /> */}
                </AnimatePresence>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-center pt-0">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <p className="text-xs text-center text-muted-foreground">
                By signing up, you agree to our{" "}
                <a href="#" className="underline hover:text-primary">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="underline hover:text-primary">
                  Privacy Policy
                </a>
              </p>
            </motion.div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}