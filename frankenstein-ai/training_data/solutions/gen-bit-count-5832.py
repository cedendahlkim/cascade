# Task: gen-bit-count-5832 | Score: 100% | 2026-02-17T20:29:57.673067

n = int(input())
binary = bin(n)[2:]
count = binary.count('1')
print(count)