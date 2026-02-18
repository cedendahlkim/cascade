# Task: gen-bit-count-2889 | Score: 100% | 2026-02-17T20:12:55.805655

n = int(input())
binary = bin(n)[2:]
count = binary.count('1')
print(count)