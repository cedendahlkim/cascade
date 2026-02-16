# Task: gen-rec-sum_digits-1015 | Score: 100% | 2026-02-13T09:22:32.935328

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)