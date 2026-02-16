# Task: gen-ll-reverse_list-1900 | Score: 100% | 2026-02-13T16:07:19.604803

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))