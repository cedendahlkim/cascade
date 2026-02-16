# Task: gen-ds-reverse_with_stack-9820 | Score: 100% | 2026-02-13T21:28:30.599131

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))