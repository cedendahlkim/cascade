# Task: gen-bit-count-3545 | Score: 100% | 2026-02-17T20:11:51.064473

n = int(input())
binary = bin(n)[2:]
count = binary.count('1')
print(count)