# Task: gen-bit-count-1127 | Score: 100% | 2026-02-17T20:11:52.203884

n = int(input())
binary = bin(n)[2:]
count = binary.count('1')
print(count)