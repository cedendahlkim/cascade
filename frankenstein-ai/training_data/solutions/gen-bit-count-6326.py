# Task: gen-bit-count-6326 | Score: 100% | 2026-02-17T20:12:52.993278

n = int(input())
binary = bin(n)[2:]
count = binary.count('1')
print(count)