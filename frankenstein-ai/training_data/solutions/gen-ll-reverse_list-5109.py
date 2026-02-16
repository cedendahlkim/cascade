# Task: gen-ll-reverse_list-5109 | Score: 100% | 2026-02-14T12:48:00.454833

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))