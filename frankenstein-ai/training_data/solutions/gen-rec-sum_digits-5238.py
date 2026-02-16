# Task: gen-rec-sum_digits-5238 | Score: 100% | 2026-02-13T18:23:00.317286

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)