# Task: gen-bit-count-3860 | Score: 100% | 2026-02-17T20:29:56.729568

n = int(input())
binary = bin(n)[2:]
count = binary.count('1')
print(count)