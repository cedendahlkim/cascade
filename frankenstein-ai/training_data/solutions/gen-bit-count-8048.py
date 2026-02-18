# Task: gen-bit-count-8048 | Score: 100% | 2026-02-17T20:11:51.627398

n = int(input())
binary = bin(n)[2:]
count = binary.count('1')
print(count)