#!/usr/bin/env python3
"""将Solidity合约中的中文注释替换为英文"""

translations = {
    # 段落标题
    "// 结构体定义": "// Struct Definitions",
    "// 状态变量": "// State Variables",
    "// 事件": "// Events",
    "// 错误定义": "// Error Definitions",
    "// 修饰器": "// Modifiers",
    "// 构造函数": "// Constructor",
    "// 管理功能": "// Admin Functions",
    "// 核心功能 - 创建提案": "// Core Functions - Create Proposal",
    "// 核心功能 - 投票": "// Core Functions - Voting",
    "// 核心功能 - 解密结果": "// Core Functions - Decrypt Results",
    "// 查询功能": "// View Functions",
    
    # 结构体字段注释
    "// 提案名称": "// Proposal name",
    "// 提案详情": "// Proposal details",
    "// 投票选项": "// Voting choices",
    "// 投票开始时间": "// Voting start time",
    "// 投票结束时间": "// Voting end time",
    "// 结果是否已公开": "// Results published flag",
    "// 提案人": "// Proposer address",
    "// 加密的票数: 选项ID => 票数": "// Encrypted votes: choiceId => vote count",
    "// 公开的票数: 选项ID => 票数": "// Public votes: choiceId => vote count",
    "// 投票记录: 地址 => 是否已投票": "// Vote record: address => voted status",
    "// 投票人数": "// Total voters count",
    
    # 函数注释
    "/**\n     * @notice 更新提案费用": "/**\n     * @notice Update proposal fee",
    "     * @param newFee 新的费用金额": "     * @param newFee New fee amount",
    "/**\n     * @notice 提取合约余额": "/**\n     * @notice Withdraw contract balance",
    "/**\n     * @notice 创建新提案": "/**\n     * @notice Create new proposal",
    "     * @param name 提案名称": "     * @param name Proposal name",
    "     * @param details 提案详情": "     * @param details Proposal details",
    "     * @param choices 投票选项数组": "     * @param choices Array of voting choices",
    "     * @param votingStart 投票开始时间": "     * @param votingStart Voting start timestamp",
    "     * @param votingEnd 投票结束时间": "     * @param votingEnd Voting end timestamp",
    "     * @return proposalId 提案ID": "     * @return proposalId Proposal ID",
    "/**\n     * @notice 投票": "/**\n     * @notice Cast vote",
    "     * @param proposalId 提案ID": "     * @param proposalId Proposal ID",
    "     * @param choiceId 选项ID": "     * @param choiceId Choice ID",
    "     * @param encryptedVote 加密的投票（值为1）": "     * @param encryptedVote Encrypted vote (value of 1)",
    "     * @param proof 零知识证明": "     * @param proof Zero-knowledge proof",
    "/**\n     * @notice 请求解密投票结果": "/**\n     * @notice Request decryption of voting results",
    "/**\n     * @notice 解密回调函数": "/**\n     * @notice Decryption callback function",
    "     * @param requestId 解密请求ID": "     * @param requestId Decryption request ID",
    "     * @param decryptedData 解密后的数据": "     * @param decryptedData Decrypted data",
    "     * @param decryptionProof 解密证明": "     * @param decryptionProof Decryption proof",
    "/**\n     * @notice 获取提案基本信息": "/**\n     * @notice Get proposal basic information",
    "/**\n     * @notice 获取提案结果（仅在公开后）": "/**\n     * @notice Get proposal results (only after published)",
    "/**\n     * @notice 检查用户是否已投票": "/**\n     * @notice Check if user has voted",
    "     * @param voter 用户地址": "     * @param voter Voter address",
    "/**\n     * @notice 获取提案数量": "/**\n     * @notice Get proposal count",
    
    # 内联注释
    "        // 验证费用": "        // Validate fee",
    "        // 验证时间窗口": "        // Validate time window",
    "        // 验证选项数量": "        // Validate choices count",
    "        // 初始化加密票数为 0": "        // Initialize encrypted votes to 0",
    "        // 检查是否已投票": "        // Check if already voted",
    "        // 验证选项ID": "        // Validate choice ID",
    "        // 导入加密的投票": "        // Import encrypted vote",
    "        // 同态加法累加票数": "        // Homomorphic addition to accumulate votes",
    "        // 授权合约访问新的加密票数": "        // Authorize contract to access new encrypted votes",
    "        // 标记已投票": "        // Mark as voted",
    "        // 查找对应的提案": "        // Find corresponding proposal",
    "        // 验证签名": "        // Verify signatures",
    "        // 解析解密后的数据": "        // Parse decrypted data",
}

def translate_file(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    for chinese, english in translations.items():
        content = content.replace(chinese, english)
    
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✅ Translated: {filename}")

if __name__ == "__main__":
    translate_file("ChainVote.sol")
