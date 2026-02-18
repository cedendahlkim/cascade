# Task: gen-bit-count-2217 | Score: 100% | 2026-02-17T20:12:56.860107

n = int(input())
binary = bin(n)[2:]
count = binary.count('1')
print(count)