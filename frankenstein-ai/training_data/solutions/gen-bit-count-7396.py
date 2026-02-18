# Task: gen-bit-count-7396 | Score: 100% | 2026-02-17T20:29:56.042358

n = int(input())
binary = bin(n)[2:]
count = binary.count('1')
print(count)