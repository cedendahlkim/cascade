# Task: gen-ll-reverse_list-6835 | Score: 100% | 2026-02-14T13:11:44.659192

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))