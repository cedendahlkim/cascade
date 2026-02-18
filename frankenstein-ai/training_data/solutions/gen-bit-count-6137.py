# Task: gen-bit-count-6137 | Score: 100% | 2026-02-17T20:29:54.986322

n = int(input())
binary = bin(n)[2:]
count = binary.count('1')
print(count)