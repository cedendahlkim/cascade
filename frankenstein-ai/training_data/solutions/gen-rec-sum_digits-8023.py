# Task: gen-rec-sum_digits-8023 | Score: 100% | 2026-02-13T18:27:40.946119

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)