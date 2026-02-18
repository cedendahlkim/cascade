# Task: gen-bit-count-5730 | Score: 100% | 2026-02-17T20:12:54.734048

n = int(input())
binary = bin(n)[2:]
count = binary.count('1')
print(count)