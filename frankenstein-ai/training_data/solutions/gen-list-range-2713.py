# Task: gen-list-range-2713 | Score: 100% | 2026-02-15T12:30:05.576386

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))