# Task: gen-rec-sum_digits-1867 | Score: 100% | 2026-02-14T12:08:12.603345

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)