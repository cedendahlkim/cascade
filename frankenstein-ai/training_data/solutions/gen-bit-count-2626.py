# Task: gen-bit-count-2626 | Score: 100% | 2026-02-17T20:29:55.484220

n = int(input())
binary = bin(n)[2:]
count = binary.count('1')
print(count)