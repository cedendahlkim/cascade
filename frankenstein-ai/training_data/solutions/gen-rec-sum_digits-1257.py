# Task: gen-rec-sum_digits-1257 | Score: 100% | 2026-02-13T18:19:27.983005

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)