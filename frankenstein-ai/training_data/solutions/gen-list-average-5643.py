# Task: gen-list-average-5643 | Score: 100% | 2026-02-13T14:01:15.300995

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))