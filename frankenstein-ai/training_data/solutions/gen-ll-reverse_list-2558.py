# Task: gen-ll-reverse_list-2558 | Score: 100% | 2026-02-15T12:29:19.211364

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))