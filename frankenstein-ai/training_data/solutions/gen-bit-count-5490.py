# Task: gen-bit-count-5490 | Score: 100% | 2026-02-17T20:29:59.609503

n = int(input())
binary = bin(n)[2:]
count = binary.count('1')
print(count)