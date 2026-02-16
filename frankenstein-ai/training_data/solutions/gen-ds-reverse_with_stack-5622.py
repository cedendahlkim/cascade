# Task: gen-ds-reverse_with_stack-5622 | Score: 100% | 2026-02-13T20:33:10.978807

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))