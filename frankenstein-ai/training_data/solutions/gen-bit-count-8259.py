# Task: gen-bit-count-8259 | Score: 100% | 2026-02-17T20:12:55.260714

n = int(input())
binary = bin(n)[2:]
count = binary.count('1')
print(count)