# Task: gen-rec-sum_digits-3705 | Score: 100% | 2026-02-14T13:11:52.144139

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)