# Task: gen-ds-reverse_with_stack-9487 | Score: 100% | 2026-02-13T18:37:55.406770

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))