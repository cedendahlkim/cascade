# Task: gen-bit-count-3939 | Score: 100% | 2026-02-17T20:12:56.336818

n = int(input())
binary = bin(n)[2:]
count = binary.count('1')
print(count)