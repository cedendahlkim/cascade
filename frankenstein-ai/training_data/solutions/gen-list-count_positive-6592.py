# Task: gen-list-count_positive-6592 | Score: 100% | 2026-02-14T12:08:55.572962

n = int(input())
lst = [int(input()) for _ in range(n)]
print(sum(1 for x in lst if x > 0))