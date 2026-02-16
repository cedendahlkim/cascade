# Task: gen-ll-reverse_list-9004 | Score: 100% | 2026-02-14T13:12:35.682979

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))