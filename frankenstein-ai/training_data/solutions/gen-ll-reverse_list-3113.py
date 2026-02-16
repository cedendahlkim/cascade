# Task: gen-ll-reverse_list-3113 | Score: 100% | 2026-02-15T08:34:50.392888

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))