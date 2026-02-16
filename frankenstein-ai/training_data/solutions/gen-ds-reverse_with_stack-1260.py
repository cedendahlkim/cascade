# Task: gen-ds-reverse_with_stack-1260 | Score: 100% | 2026-02-14T13:41:03.219443

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))