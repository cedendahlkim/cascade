# Task: gen-ll-reverse_list-3934 | Score: 100% | 2026-02-13T15:28:25.734888

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))