"use client";

import { useMemo } from "react";
import { cookieStore } from "@/utils/cookieStore";

export type Role = "ADM" | "MGR" | "AST" | "OTHER";

export const usePermissions = () => {
  const userInfo = useMemo(() => cookieStore.getAllUserInfo(), []);
  
  const level = userInfo.level as Role;
  
  const isAdmin = level === "ADM";
  const isMgr = level === "MGR";
  const isAst = level === "AST";
  
  const canApprove = isAdmin || isMgr;
  const canUpload = isMgr; // Per existing middleware logic

  return {
    userInfo,
    level,
    isAdmin,
    isMgr,
    isAst,
    canApprove,
    canUpload
  };
};
