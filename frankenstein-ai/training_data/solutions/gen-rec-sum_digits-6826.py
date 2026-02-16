# Task: gen-rec-sum_digits-6826 | Score: 100% | 2026-02-13T13:09:42.819281

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)