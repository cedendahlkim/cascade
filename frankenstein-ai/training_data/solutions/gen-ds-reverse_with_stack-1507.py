# Task: gen-ds-reverse_with_stack-1507 | Score: 100% | 2026-02-14T12:04:53.508092

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))