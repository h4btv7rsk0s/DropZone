#!/usr/bin/env python3
import re

def translate_all_chinese(filename):
    """将所有中文替换为英文"""
    
    # 完整的翻译映射
    translations = {
        "提案ID => 解密请求ID": "proposalId => decryption requestId",
        "提案ID": "proposal ID",
        "解密请求ID": "decryption request ID",
        "选项ID": "choice ID",
        "票数": "vote count",
        "地址": "address",
        "是否已投票": "voted status",
        "提案名称": "proposal name",
        "提案详情": "proposal details",
        "投票选项": "voting choices",
        "投票开始时间": "voting start time",
        "投票结束时间": "voting end time",
        "结果是否已公开": "results published",
        "提案人": "proposer",
        "加密的票数": "encrypted votes",
        "公开的票数": "public votes",
        "投票记录": "vote record",
        "投票人数": "voter count",
        "新的费用金额": "new fee amount",
        "提案名称": "proposal name",
        "提案详情": "proposal details", 
        "投票选项数组": "array of voting choices",
        "投票开始时间": "voting start timestamp",
        "投票结束时间": "voting end timestamp",
        "选项ID": "choice ID",
        "加密的投票（值为1）": "encrypted vote (value of 1)",
        "零知识证明": "zero-knowledge proof",
        "解密后的数据": "decrypted data",
        "解密证明": "decryption proof",
        "用户地址": "voter address",
    }
    
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 替换所有翻译
    for cn, en in translations.items():
        content = content.replace(cn, en)
    
    # 检查是否还有中文
    chinese_pattern = re.compile(r'[\u4e00-\u9fa5]+')
    remaining = chinese_pattern.findall(content)
    
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(content)
    
    if remaining:
        print(f"⚠️  仍有中文: {set(remaining)}")
    else:
        print(f"✅ 所有中文已替换")
    
    return len(remaining) == 0

if __name__ == "__main__":
    translate_all_chinese("ChainVote.sol")
