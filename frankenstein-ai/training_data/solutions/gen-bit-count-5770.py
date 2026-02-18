# Task: gen-bit-count-5770 | Score: 100% | 2026-02-17T20:11:50.589669

n = int(input())
binary = bin(n)[2:]
count = binary.count('1')
print(count)