# Task: gen-bit-count-6948 | Score: 100% | 2026-02-17T20:30:00.777448

n = int(input())
binary = bin(n)[2:]
count = binary.count('1')
print(count)