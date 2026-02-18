# Task: gen-bit-count-7100 | Score: 100% | 2026-02-17T20:12:54.091625

n = int(input())
binary = bin(n)[2:]
count = binary.count('1')
print(count)