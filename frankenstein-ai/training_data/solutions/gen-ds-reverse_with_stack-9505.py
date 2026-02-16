# Task: gen-ds-reverse_with_stack-9505 | Score: 100% | 2026-02-14T12:08:34.518770

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))