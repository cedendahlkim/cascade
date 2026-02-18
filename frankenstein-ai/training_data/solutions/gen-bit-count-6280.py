# Task: gen-bit-count-6280 | Score: 100% | 2026-02-17T20:11:52.885779

n = int(input())
binary = bin(n)[2:]
count = binary.count('1')
print(count)