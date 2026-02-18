# Task: gen-bit-count-3094 | Score: 100% | 2026-02-17T20:29:58.770665

n = int(input())
binary = bin(n)[2:]
count = binary.count('1')
print(count)