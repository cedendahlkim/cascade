# Task: gen-rec-sum_digits-1108 | Score: 100% | 2026-02-15T08:15:24.563193

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)