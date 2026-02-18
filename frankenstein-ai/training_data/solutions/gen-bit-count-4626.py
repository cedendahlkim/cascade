# Task: gen-bit-count-4626 | Score: 100% | 2026-02-17T20:11:58.028904

n = int(input())
binary = bin(n)[2:]
count = binary.count('1')
print(count)